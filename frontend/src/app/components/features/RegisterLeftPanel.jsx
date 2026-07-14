import ClayScene from "./ClayScene";

export default function RegisterLeftPanel() {
  return (
    <aside className="hidden lg:flex lg:w-[46%] xl:w-[48%] flex-shrink-0 min-h-screen bg-[#ccef8d] p-6 xl:p-9">
      <div className="w-full h-full min-h-[640px] rounded-[32px] bg-[#173f35] p-3 xl:p-4 shadow-[0_22px_40px_rgba(24,65,43,.25)]">
        <div className="w-full h-full overflow-hidden rounded-[22px] bg-[#d7f6ad]">
          <ClayScene />
        </div>
      </div>
    </aside>
  );
}
