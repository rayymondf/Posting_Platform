export default function Button({
  children,
  className = '',
  icon: Icon,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  // Map variant names to CSS classes
  const variantClass = variant === 'primary' ? 'btn' : `btn btn-${variant}`;
  return (
    <button className={`${variantClass} ${className}`.trim()} type={type} {...props}>
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
