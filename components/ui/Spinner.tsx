import { cn } from './cn';

const sizeClasses = {
	sm: 'h-5 w-5',   // 20px — used inside buttons
	md: 'h-6 w-6',   // 24px — used inside buttons
	lg: 'h-8 w-8',   // 32px — standalone loading state
};

interface SpinnerProps {
	size?: keyof typeof sizeClasses;
	className?: string;
}

export function Spinner({ size = 'lg', className }: SpinnerProps) {
	return (
		<svg
			className={cn('animate-spin text-current', sizeClasses[size], className)}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	);
}
