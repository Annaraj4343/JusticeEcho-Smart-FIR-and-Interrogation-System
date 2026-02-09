try {
    console.log('Raw JSON data:', rawData); // Debugging log
    const parsedData = JSON.parse(rawData);
    console.log('Parsed JSON data:', parsedData); // Debugging log
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    console.error('Problematic JSON snippet:', rawData.slice(0, 500)); // Log the first 500 characters of the JSON
    return res.status(400).json({ error: 'Invalid JSON format', details: error.message });
  }