export const allocationGroups = ["sector", "stock"] as const;
export type AllocationGroup = (typeof allocationGroups)[number];
export const defaultAllocationGroup: AllocationGroup = "sector";
