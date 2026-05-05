import { FileText } from 'lucide-react';

export default function HomePage() {
	return (
		<div className="max-w-2xl">
			<h1 className="text-3xl font-bold text-foreground mb-6">Ressources</h1>
			<ul className="flex flex-col gap-2">
				<li>
					<a
						href="https://profuse-smash-889.notion.site/Scooting-272f07a4069a809f951cc08bf8e116a1?pvs=73"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-foreground"
					>
						<FileText className="h-4 w-4 text-muted-foreground shrink-0" />
						<span className="text-sm">Tutoriel du scooting (Notion)</span>
					</a>
				</li>
			</ul>
		</div>
	);
}
