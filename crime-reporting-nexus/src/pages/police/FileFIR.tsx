
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VoiceFIRForm from '@/components/fir/VoiceFIRForm';

const PoliceFileFIR = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">File a New FIR</h1>
        <p className="text-gray-500">File an FIR on behalf of a citizen or for official records</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Official FIR Filing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This form is for official police use to record incidents reported in person or through other channels.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">1</span>
              <span>Ensure you have collected all necessary details from the complainant.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">2</span>
              <span>Use voice recording for quick data entry or type details manually.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">3</span>
              <span>Set appropriate priority level based on the severity of the incident.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fir-100 text-fir-600 text-xs font-medium">4</span>
              <span>All FIRs will be automatically assigned to you as the reporting officer.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <VoiceFIRForm />
    </div>
  );
};

export default PoliceFileFIR;
