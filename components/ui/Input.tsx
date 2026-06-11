import { forwardRef } from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, fullWidth, className, id, ...props }, ref) => {
		const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

		return (
			<div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
				{label && (
					<label htmlFor={inputId} className="text-sm font-medium text-foreground">
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					spellCheck={false}
					autoCorrect="off"
					autoCapitalize="off"
					autoComplete="off"
					className={cn(
						'h-9 rounded-md border border-white/25 bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						fullWidth && 'w-full',
						className,
					)}
					{...props}
				/>
			</div>
		);
	},
);

Input.displayName = 'Input';
