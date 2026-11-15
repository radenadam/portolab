/** Ordinary reviews keep their own allowance, so late merges cannot replenish it. Failed rounds count too. */
export const reviewRoundLimit = 5;

/** Finding fixes keep their own allowance after ordinary reviews, so merge reviews cannot replenish it. */
export const checkRoundLimit = 2;

/** Failed merge reviews count too, so repeated merges of the base branch cannot restart the panel without end. */
export const mergeReviewRoundLimit = 2;
