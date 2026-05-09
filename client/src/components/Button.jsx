export default function Button({
  children,
  className = '',
  icon: Icon,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} type={type} {...props}>
      {Icon ? <Icon size={18} strokeWidth={2.4} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
