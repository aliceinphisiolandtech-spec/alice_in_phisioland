import { signIn } from "next-auth/react";

export const SocialButton = ({
  icon: Icon,
  label,
  provider,
}: {
  icon: React.ElementType;
  label: string;
  provider: string;
}) => (
  <button
    onClick={() => signIn(provider, { callbackUrl: "/admin" })}
    className="group relative flex w-full items-center justify-start gap-4 cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-6 py-4 transition-all duration-300 hover:border-[#0c493e]/30 hover:bg-white hover:shadow-lg active:scale-[0.99] max-[980px]:justify-center"
  >
    <div className="flex h-6 w-6 items-center justify-center">
      <Icon className="h-5 w-5 text-gray-700" />
    </div>
    <span className="font-semibold text-gray-600 group-hover:text-[#0c493e]">
      Kontynuuj przez {label}
    </span>
  </button>
);
