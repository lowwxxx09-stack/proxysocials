import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditServiceForm from "@/components/EditServiceForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditServicePage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-sky-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-extrabold text-sky-700">
          Edit Service
        </h1>

        <p className="text-gray-600 mt-2">
          Update your service information below.
        </p>

        <EditServiceForm service={service} />

      </div>
    </main>
  );
}