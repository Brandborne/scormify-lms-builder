interface ControlMode {
  choice?: boolean;
  choiceExit?: boolean;
  flow?: boolean;
  forwardOnly?: boolean;
  useCurrentAttemptObjectiveInfo?: boolean;
  useCurrentAttemptProgressInfo?: boolean;
}

interface DeliveryControls {
  tracked?: boolean;
  completionSetByContent?: boolean;
  objectiveSetByContent?: boolean;
}

interface SequencingRules {
  controlMode?: ControlMode;
  deliveryControls?: DeliveryControls;
  constrainChoice?: boolean;
  preventActivation?: boolean;
}

export function parseSequencing(sequencingNode: any): SequencingRules {
  if (!sequencingNode) return {};

  const controlMode = sequencingNode['imsss:controlMode']?.[0];
  const deliveryControls = sequencingNode['imsss:deliveryControls']?.[0];

  return {
    controlMode: controlMode ? {
      choice: controlMode['$choice'] === 'true',
      choiceExit: controlMode['$choiceExit'] === 'true',
      flow: controlMode['$flow'] === 'true',
      forwardOnly: controlMode['$forwardOnly'] === 'true',
      useCurrentAttemptObjectiveInfo: controlMode['$useCurrentAttemptObjectiveInfo'] === 'true',
      useCurrentAttemptProgressInfo: controlMode['$useCurrentAttemptProgressInfo'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      tracked: deliveryControls['$tracked'] === 'true',
      completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
    } : undefined,
    constrainChoice: sequencingNode['imsss:constrainChoice']?.[0] === 'true',
    preventActivation: sequencingNode['imsss:preventActivation']?.[0] === 'true'
  };
}