from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import re
import os
import sys
import logging
import cv2
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Set Tesseract path
if sys.platform == "win32":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize Firebase Admin SDK
cred = credentials.Certificate('../justiceecho-168ea-firebase-adminsdk-fbsvc-4963738d33.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def preprocess_image(image_path):
    # Read image using opencv
    img = cv2.imread(image_path)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to preprocess the image
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    
    # Apply dilation to connect text components
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
    gray = cv2.dilate(gray, kernel, iterations=1)
    
    # Write the grayscale image to disk as temporary file
    cv2.imwrite(image_path + "_processed.png", gray)
    
    return image_path + "_processed.png"

def extract_aadhar_info(text):
    logger.debug(f"Extracted text from image: {text}")
    
    # Clean up the text
    text = text.replace('\n', ' ').replace('\r', ' ')
    text = ' '.join(text.split())
    logger.debug(f"Cleaned text: {text}")

    # Common patterns in Aadhar cards with more flexible matching
    patterns = {
        'name': [
            # Look for a line that contains exactly three capitalized words
            r'\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b',
            # Look for three consecutive words before DOB/OFA
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2})(?=\s+(?:OFA|DOB|arta))',
            # Backup pattern for any three consecutive capitalized words
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2})\b',
        ],
        'dob': [
            r'(?:DOB|Date of Birth|Birth|जन्म)[:\s]*(\d{1,2}/\d{1,2}/\d{4})',
            r'OFA\s*arta/DOB:\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})',
        ],
        'gender': [
            r'(?:Gender|Sex|लिंग)[:\s]*(MALE|FEMALE|Male|Female|M|F)',
            r'\b(MALE|FEMALE|Male|Female)\b',
            r'qea/\s*(MALE|FEMALE)',
        ],
        'aadhar': [
            r'(\d{4}\s+\d{4}\s+\d{4})',
            r'(\d{4}[\s-]*\d{4}[\s-]*\d{4})',
        ],
        'vid': [
            r'VID\s*:\s*(\d{4}\s*\d{4}\s*\d{3})',
            r'VID\s*(\d{4}\s*\d{4}\s*\d{3})',
        ],
        'issueDate': [
            r'(?:Issue|tssue)\s*(?:Date|Deve):\s*(\d{2}/\d{2}/\d{4})',
            r'(?:Issue|tssue).*?(\d{2}/\d{2}/\d{4})',
        ],
    }

    extracted_data = {
        'name': '',
        'dob': '',
        'gender': '',
        'aadharNumber': '',
        'vid': '',
        'issueDate': ''
    }

    # Try each pattern for each field
    for field, field_patterns in patterns.items():
        for pattern in field_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE if field != 'name' else 0)  # Case sensitive for name
            for match in matches:
                try:
                    if field == 'aadhar':
                        aadhar = match.group(1) if match.groups() else match.group(0)
                        aadhar = re.sub(r'\D', '', aadhar)
                        if len(aadhar) == 12:
                            extracted_data['aadharNumber'] = aadhar
                            break
                    elif field == 'gender':
                        gender = match.group(1) if match.groups() else match.group(0)
                        extracted_data['gender'] = gender.upper()
                        break
                    elif field == 'vid':
                        vid = match.group(1) if match.groups() else match.group(0)
                        vid = re.sub(r'\D', '', vid)
                        if len(vid) == 11:
                            extracted_data['vid'] = vid
                            break
                    elif field == 'name':
                        name = match.group(1) if match.groups() else match.group(0)
                        # Verify it's a proper name (three words, each capitalized)
                        name_parts = name.strip().split()
                        if len(name_parts) == 3 and all(part[0].isupper() for part in name_parts):
                            extracted_data['name'] = name
                            break
                    else:
                        value = match.group(1) if match.groups() else match.group(0)
                        if value and len(value.strip()) > 0:
                            extracted_data[field] = value.strip()
                            break
                except (IndexError, AttributeError) as e:
                    logger.warning(f"Error processing {field} match: {e}")
                    continue

    logger.debug(f"Extracted data: {extracted_data}")
    return extracted_data

@app.route('/process-aadhar', methods=['POST'])
def process_aadhar():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Save the uploaded file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        logger.debug(f"File saved at: {file_path}")

        try:
            # Preprocess the image
            processed_image_path = preprocess_image(file_path)

            # Try different OCR configurations
            configs = [
                '--psm 3',  # Default
                '--psm 4',  # Assume a single column of text
                '--psm 6',  # Assume a uniform block of text
            ]

            text = ''
            for config in configs:
                try:
                    current_text = pytesseract.image_to_string(
                        Image.open(processed_image_path),
                        lang='eng',
                        config=config
                    )
                    if len(current_text.strip()) > len(text.strip()):
                        text = current_text
                except Exception as e:
                    logger.warning(f"OCR failed with config {config}: {str(e)}")
                    continue

            logger.debug(f"OCR completed successfully")

            # Clean up processed image
            if os.path.exists(processed_image_path):
                os.remove(processed_image_path)

        except Exception as e:
            logger.error(f"Error during OCR: {str(e)}")
            # Clean up files
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(processed_image_path):
                os.remove(processed_image_path)
            return jsonify({
                "error": "Failed to process image",
                "details": str(e)
            }), 500

        # Extract information
        aadhar_data = extract_aadhar_info(text)

        # Clean up original file
        if os.path.exists(file_path):
            os.remove(file_path)

        # Save to Firebase (optional, only if user_id is provided)
        user_id = request.form.get('user_id')
        logger.debug(f"Received user_id: {user_id}")

        if user_id:
            try:
                db.collection('users').document(user_id).set({
                    'aadharData': aadhar_data
                }, merge=True)
                logger.debug("Aadhar data successfully saved to Firebase.")
            except Exception as e:
                logger.error(f"Error saving Aadhar data to Firebase: {e}")

        return jsonify(aadhar_data)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        # Clean up files
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({
            "error": "Failed to process Aadhar card",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
