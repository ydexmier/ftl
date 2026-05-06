import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from './cn';

const alertVariants = cva(
	'relative flex items-start gap-3 rounded-lg border p-4 text-sm',
	{
		variants: {
			severity: {
				error: 'border-red-800 bg-red-950/40 text-red-300',
				success: 'border-green-800 bg-green-950/40 text-green-300',
				info: 'border-blue-800 bg-blue-950/40 text-blue-300',
				warning: 'border-yellow-800 bg-yellow-950/40 text-yellow-300',
			},
		},
		defaultVariants: {
			severity: 'info',
		},
	},
);

const icons = {
	error: AlertCircle,
	success: CheckCircle2,
	info: Info,
	warning: TriangleAlert,
};

export interface AlertProps extends VariantProps<typeof alertVariants> {
	children: React.ReactNode;
	onClose?: () => void;
	className?: string;
}

export function Alert({ severity = 'info', children, onClose, className }: AlertProps) {
	const Icon = icons[severity ?? 'info'];

	return (
		<div className={cn(alertVariants({ severity }), className)} role="alert">
			<Icon className="mt-0.5 h-4 w-4 shrink-0" />
			<div className="flex-1">{children}</div>
			{onClose && (
				<button
					onClick={onClose}
					className="ml-auto -mr-1 rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
					aria-label="Fermer"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
