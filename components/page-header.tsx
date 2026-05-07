import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {icon && <div style={{ color: '#e68bbe' }}>{icon}</div>}
            <h1 className="text-4xl font-bold" style={{ color: '#2d1b3d' }}>
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-muted-foreground text-base">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {/* Decorative line */}
      <div
        className="h-1 w-24 rounded-full"
        style={{ backgroundColor: '#e68bbe' }}
      />
    </div>
  );
}
