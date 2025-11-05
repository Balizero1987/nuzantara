export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
