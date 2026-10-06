// Static mirror of src/lib/prismaData/common/utils/getUserProfile.ts
// Anonymous shape: the static site has no auth, so there is never a
// logged-in session. Callers destructure this, so shape must match exactly.
export interface ProfileInfo {
  email: string;
  name: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  id: number;
  configData?: any;
  codeCampYear?: any;
}

export async function getUserProfile(): Promise<ProfileInfo> {
  return {
    email: "",
    name: "",
    isAdmin: false,
    isLoggedIn: false,
    id: 0,
  };
}
