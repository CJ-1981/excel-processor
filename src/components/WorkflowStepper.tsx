import { Stepper, Step, StepLabel, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/system';
import type { AppStatus } from '../App';

interface WorkflowStepperProps {
  currentStep: AppStatus;
  sx?: SxProps<Theme>;
}

/**
 * Maps AppStatus to step index for the workflow stepper.
 */
const getStepIndex = (status: AppStatus): number => {
  switch (status) {
    case 'ready':
      return 0;
    case 'parsing':
      return 1;
    case 'files_uploaded':
      return 1;
    case 'data_merged':
      return 2;
    default:
      return 0;
  }
};

const steps = [
  'Upload Files',
  'Select Sheets',
  'Process Data'
];

/**
 * Visual workflow stepper showing current progress through the application.
 */
export default function WorkflowStepper({ currentStep, sx }: WorkflowStepperProps) {
  const activeStep = getStepIndex(currentStep);

  return (
    <Box sx={{ width: '100%', mb: 4, ...sx }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
