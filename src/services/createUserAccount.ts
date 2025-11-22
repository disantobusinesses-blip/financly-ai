export interface CreateUserAccountPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  selectedPlan: string;
  selectedPlanInterval?: "month" | "year";
  selectedPriceId?: string;
}

/**
 * Placeholder for real account creation logic. Wire this up to your backend when ready.
 */
export const createUserAccount = async (
  payload: CreateUserAccountPayload
): Promise<{ success: boolean }> => {
  // Simulate a short network delay to mirror a real API call.
  await new Promise((resolve) => setTimeout(resolve, 650));
  console.info("createUserAccount payload", payload);
  return { success: true };
};
