export interface CreateBountyParams {
  bounty_type: 0 | 1 | 2;
  brief_blob_id: number[];
  brief_content_hash: number[];
  submission_deadline: number;
  judging_deadline: number;
  poster_weight: number;
  max_judges: number;
  contest_splits: number[];
  is_recurring: boolean;
  auto_extend: boolean;
  category_tags: string[];
  prizeAmountMist: number;
}
