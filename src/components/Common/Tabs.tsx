import React from "react";

interface TabsProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
}

interface TabProps {
  id: string;
  title: string;
  isActive?: boolean;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onChange,
  children,
}) => {
  return (
    <div className="flex gap-4 border-b mb-4">
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          isActive: child.props.id === activeTab,
          onChange,
        })
      )}
    </div>
  );
};

export const Tab: React.FC<TabProps> = ({ id, title, isActive, onChange }) => {
  return (
    <button
      onClick={() => onChange?.(id)}
      className={`pb-2 px-3 text-sm border-b-2 ${
        isActive
          ? "border-teal-500 text-teal-600"
          : "border-transparent text-gray-500"
      }`}
    >
      {title}
    </button>
  );
};
