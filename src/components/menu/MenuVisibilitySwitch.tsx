"use client";

import { Switch } from "@/components/ui/switch";

interface MenuVisibilitySwitchProps {
  visible: boolean;
  active: boolean;
  onVisibleChange: (visible: boolean) => void;
  onActiveChange: (active: boolean) => void;
}

export function MenuVisibilitySwitch({
  visible,
  active,
  onVisibleChange,
  onActiveChange,
}: MenuVisibilitySwitchProps) {
  return (
    <div className="space-y-3">
      <Switch
        label="Visible"
        description="Mostrar en el portal público."
        checked={visible}
        onChange={onVisibleChange}
      />
      <Switch
        label="Activo"
        description="Habilitar este ítem en la navegación."
        checked={active}
        onChange={onActiveChange}
      />
    </div>
  );
}
