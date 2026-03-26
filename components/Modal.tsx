"use client"

type ModalProps = {
  children: React.ReactNode
  onClose: () => void
  title: string
  width?: number
}

export default function Modal({ children, onClose, title, width = 460 }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-y-auto rounded-2xl border border-[#2A2E42] bg-[#161825] p-7 shadow-2xl"
        style={{ maxWidth: width, maxHeight: "90vh" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#E2E4EA]">{title}</h2>
          <button
            onClick={onClose}
            className="border-none bg-none text-xl text-[#5A5E72] cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}