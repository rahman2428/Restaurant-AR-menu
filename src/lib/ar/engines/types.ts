export type RenderEngineKind = "webxr" | "quick-look" | "viewer";

export interface RenderEngineDescriptor {
  kind: RenderEngineKind;
  badge: string;
  headline: string;
  helperText: string;
  actionLabel: string;
  canLaunch: boolean;
}

