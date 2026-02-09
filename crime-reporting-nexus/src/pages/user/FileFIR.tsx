
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VoiceFIRForm from '@/components/fir/VoiceFIRForm';

const FileFIR = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">File a New FIR</h1>
        <p className="text-gray-500">Use voice input to quickly report an incident</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Guidelines for Filing an FIR</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">1</span>
              <span>Provide accurate information about the incident including date, time, and location.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">2</span>
              <span>Describe what happened in detail, including descriptions of people involved if applicable.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">3</span>
              <span>Speak clearly when using the voice recording feature for accurate transcription.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">4</span>
              <span>Review the transcription and make edits if necessary before submitting.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <VoiceFIRForm />
    </div>
  );
};

export default FileFIR;
