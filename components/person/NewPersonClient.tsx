"use client";

import { useRouter } from "next/navigation";
import { toast } from "@/lib/utils/toast";
import { PersonForm } from "./PersonForm";
import { useCreatePerson } from "@/lib/hooks/usePersons";
import type { PersonFormValues } from "@/lib/validations/personSchema";

interface NewPersonClientProps {
  userId: string;
}

export function NewPersonClient({ userId }: NewPersonClientProps) {
  const router = useRouter();
  const createPerson = useCreatePerson();

  async function handleSubmit(values: PersonFormValues) {
    const person = await createPerson.mutateAsync({
      ...values,
      ownerId: userId,
    });
    toast.success(`${person.first_name} ${person.surname} added to your tree.`);
    router.push(`/tree`);
  }

  return (
    <PersonForm
      onSubmit={handleSubmit}
      submitLabel="Add to family tree"
    />
  );
}
