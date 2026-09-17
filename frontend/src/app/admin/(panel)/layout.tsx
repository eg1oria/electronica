import { Sidebar } from "@/components/admin/sidebar";
import { requireUser } from "@/lib/admin/session";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();

  return (
    <>
      <Sidebar user={user} />
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>
    </>
  );
}
