"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ExperienceActionContext } from "@/core/experience/actions";
import "@/core/experience/actions/handlers";
import { ExperienceFormHost } from "./ExperienceFormHost";
import { ExperienceModalHost } from "./ExperienceModalHost";

const ExperienceActionReactContext = createContext<ExperienceActionContext | null>(null);

interface ExperienceActionProviderProps {
  children: ReactNode;
}

export function ExperienceActionProvider({ children }: ExperienceActionProviderProps) {
  const router = useRouter();
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const openForm = useCallback((formId: string) => {
    setActiveFormId(formId);
  }, []);

  const openModal = useCallback((modalId: string) => {
    setActiveModalId(modalId);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  const value = useMemo<ExperienceActionContext>(
    () => ({ openForm, openModal, navigate }),
    [openForm, openModal, navigate]
  );

  return (
    <ExperienceActionReactContext.Provider value={value}>
      {children}
      <ExperienceFormHost formId={activeFormId} onClose={() => setActiveFormId(null)} />
      <ExperienceModalHost modalId={activeModalId} onClose={() => setActiveModalId(null)} />
    </ExperienceActionReactContext.Provider>
  );
}

const fallbackContext: ExperienceActionContext = {
  openForm: (formId) => {
    if (typeof window !== "undefined") {
      console.warn(
        `[Experience Action] openForm("${formId}") sin ExperienceActionProvider`
      );
    }
  },
  openModal: (modalId) => {
    if (typeof window !== "undefined") {
      console.warn(
        `[Experience Action] openModal("${modalId}") sin ExperienceActionProvider`
      );
    }
  },
  navigate: (href) => {
    if (typeof window !== "undefined") {
      window.location.assign(href);
    }
  },
};

export function useExperienceAction(): ExperienceActionContext {
  return useContext(ExperienceActionReactContext) ?? fallbackContext;
}

/** @deprecated Use ExperienceActionProvider */
export const CtaActionProvider = ExperienceActionProvider;

/** @deprecated Use useExperienceAction */
export const useCtaAction = useExperienceAction;
