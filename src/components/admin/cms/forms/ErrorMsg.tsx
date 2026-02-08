interface ErrorMsgProps {
  error?: {
    message?: string;
  };
}

export const ErrorMsg = ({ error }: ErrorMsgProps) => {
  if (!error || !error.message) return null;

  return (
    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
      • {error.message}
    </p>
  );
};
