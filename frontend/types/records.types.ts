export type ImageRecord = { path: string; public_id: string };
export type Staff = {
  _id: string;
  full_name: string;
  employee_id: string;
  department: string;
  position?: string;
  phone?: number;
  email?: string;
  joining_date: string;
  monthly_salary: number;
  status: "Active" | "Inactive" | "On Leave";
  profile_image?: ImageRecord;
  address?: string;
  notes?: string;
};
export type CompanyFile = {
  _id: string;
  name: string;
  parentFolder: string | null;
  file: ImageRecord;
  uploadedBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
};
export type Folder = {
  _id: string;
  name: string;
  category: string;
  parentFolder: string | null;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
};
export type FolderContents = {
  folder: Folder;
  subfolders: Folder[];
  files: CompanyFile[];
};
export type Vault = {
  _id: string;
  title: string;
  username: string;
  password: string;
  website_url?: string;
  category?: "Bank" | "Governemnt";
  status?: "Active" | "inActive";
  notes?: string;
};
export type VaultInput = Omit<Vault, "_id">;
export type ListParams = {
  query?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  parentFolder?: string;
  department?: string;
  status?: string;
  category?: string;
};
