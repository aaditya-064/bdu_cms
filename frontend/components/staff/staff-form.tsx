"use client";
import { useState, type FormEvent } from "react";
import { createStaff, updateStaff } from "@/api/staff.api";
import { useAuth } from "@/hooks/auth.hook";
import { canCreateDocuments, canEditStaff } from "@/utils/permissions";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { Staff } from "@/types/records.types";
import { errorMessage } from "@/utils/api-error";

export function StaffForm({
  staff,
  onClose,
  onSaved,
}: {
  staff?: Staff;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      if (staff ? !canEditStaff(user) : !canCreateDocuments(user))
        throw new Error("You do not have permission to save this record.");
      const data = new FormData(event.currentTarget);
      for (const key of [
        "full_name",
        "employee_id",
        "department",
        "position",
        "email",
        "address",
        "notes",
      ])
        data.set(key, String(data.get(key) ?? "").trim());
      if (
        String(data.get("full_name")).length < 3 ||
        !data.get("employee_id") ||
        !data.get("department")
      )
        throw new Error("Please enter a name, employee ID and department.");
      // An empty edit value clears the optional numeric field; omission keeps it.
      if (!staff && !data.get("phone")) data.delete("phone");
      const photo = data.get("profile_image");
      if (!(photo instanceof File) || !photo.size) data.delete("profile_image");
      else if (
        !/^image\/(jpeg|png|webp)$/.test(photo.type) ||
        photo.size > 5 * 1024 * 1024
      )
        throw new Error("Choose a JPG, PNG or WebP photo under 5 MB.");
      if (staff) await updateStaff(staff._id, data);
      else await createStaff(data);
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open
      wide
      onClose={() => {
        if (!pending) onClose();
      }}
      title={staff ? "Edit staff member" : "Add staff member"}
      description="Keep employee information accurate and up to date."
    >
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="full_name"
              name="full_name"
              label="Full name"
              defaultValue={staff?.full_name}
              required
              minLength={3}
            />
            <Input
              id="employee_id"
              name="employee_id"
              label="Employee ID"
              defaultValue={staff?.employee_id}
              required
            />
            <Input
              id="department"
              name="department"
              label="Department"
              defaultValue={staff?.department}
              required
            />
            <Input
              id="position"
              name="position"
              label="Position"
              defaultValue={staff?.position}
            />
            <Input
              id="phone"
              name="phone"
              label="Phone number"
              type="tel"
              defaultValue={staff?.phone?.toString()}
              pattern="[0-9]{10}"
              maxLength={10}
            />
            <Input
              id="email"
              name="email"
              label="Email address"
              type="email"
              defaultValue={staff?.email}
            />
            <Input
              id="joining_date"
              name="joining_date"
              label="Joining date"
              type="date"
              defaultValue={staff?.joining_date?.slice(0, 10)}
              required
            />
            <Input
              id="monthly_salary"
              name="monthly_salary"
              label="Monthly salary"
              type="number"
              min={0}
              step="0.01"
              defaultValue={staff?.monthly_salary}
              required
            />
            <Select
              id="status"
              name="status"
              label="Status"
              defaultValue={staff?.status ?? "Active"}
            >
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </Select>
            <Input
              id="profile_image"
              name="profile_image"
              label="Profile photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hint={
                staff
                  ? "Leave empty to keep the current photo."
                  : "JPG, PNG or WebP, up to 5 MB."
              }
            />
          </div>
          <Input
            id="address"
            name="address"
            label="Address"
            defaultValue={staff?.address}
          />
          <Textarea
            id="notes"
            name="notes"
            label="Notes"
            defaultValue={staff?.notes}
          />
          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" pending={pending}>
              {staff ? "Save changes" : "Add staff member"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
