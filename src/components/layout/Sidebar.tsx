import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarItem {
  icon: ReactNode;
  label: string;
  path?: string;
  badge?: number | string;
  onClick?: () => void;
  children?: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export function Sidebar({ sections, user, onLogout }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-60 bg-thrift-surface border-r border-thrift-border h-screen fixed left-0 top-0 flex flex-col">
      {user && (
        <div className="p-4 border-b border-thrift-border">
          <div className="flex items-center gap-3">
            <UserAvatar src={user.avatar} name={user.name} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-medium text-thrift-text text-sm">{user.name}</p>
              <span className="text-xs bg-thrift-secondary/10 text-thrift-secondary px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {section.title && (
              <h3 className="px-4 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <ul>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          expandedItems.includes(item.label) ? 'bg-thrift-primary/5' : ''
                        }`}
                      >
                        <span className="w-5 h-5">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {expandedItems.includes(item.label) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedItems.includes(item.label) && (
                        <ul className="ml-8 space-y-1 mt-1">
                          {item.children.map((child, childIndex) => (
                            <li key={childIndex}>
                              {child.path ? (
                                <Link
                                  to={child.path}
                                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lf transition-colors ${
                                    isActive(child.path)
                                      ? 'bg-thrift-primary text-white'
                                      : 'text-thrift-text-secondary hover:bg-thrift-border/50'
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              ) : (
                                <button
                                  onClick={onLogout}
                                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-thrift-text-secondary hover:bg-thrift-border/50 rounded-lf transition-colors"
                                >
                                  {child.label}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text-secondary hover:bg-thrift-border/50 transition-colors"
                    >
                      <span className="w-5 h-5">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    item.path && (
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-thrift-primary text-white'
                            : 'text-thrift-text-secondary hover:bg-thrift-border/50'
                        }`}
                      >
                        <span className="w-5 h-5">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                              isActive(item.path) ? 'bg-white/20' : 'bg-thrift-primary text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
