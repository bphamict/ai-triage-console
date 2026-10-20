import { z } from 'zod';
import {
  Department,
  Priority,
  RecommendedState,
  RiskFlag,
} from './enums.js';

export const ProposedStepSchema = z.object({
  action: z.string().min(1),
  completion_condition: z.string().min(1),
});

export const AiProposalSchema = z.object({
  department: z.nativeEnum(Department),
  priority: z.nativeEnum(Priority),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(240),
  proposed_owner: z.string().min(1),
  proposed_steps: z.array(ProposedStepSchema).min(1),
  risk_flags: z.array(z.nativeEnum(RiskFlag)),
  recommended_state: z.nativeEnum(RecommendedState),
  duplicate_of: z.string().optional(),
});

export type AiProposalDto = z.infer<typeof AiProposalSchema>;

/** Force Needs Review when confidence is low or high-risk flags are present. */
export function applyConfidenceRouting(
  proposal: AiProposalDto,
  threshold = 0.7,
): AiProposalDto {
  const forceReviewFlags: RiskFlag[] = [
    RiskFlag.Conflict,
    RiskFlag.Security,
    RiskFlag.Privacy,
    RiskFlag.Duplicate,
    RiskFlag.MissingInformation,
  ];
  const hasForceFlag = proposal.risk_flags.some((f) =>
    forceReviewFlags.includes(f),
  );
  if (proposal.confidence < threshold || hasForceFlag) {
    return {
      ...proposal,
      recommended_state: RecommendedState.NeedsReview,
    };
  }
  return proposal;
}
