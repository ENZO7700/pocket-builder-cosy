declare module "idiomorph" {
  export const Idiomorph: {
    morph: (
      oldNode: Element,
      newContent: Element | Node | string,
      config?: {
        morphStyle?: "outerHTML" | "innerHTML";
        ignoreActive?: boolean;
        ignoreActiveValue?: boolean;
        restoreFocus?: boolean;
        head?: { style?: "merge" | "append" | "morph" | "none" };
        callbacks?: {
          beforeNodeAdded?: (node: Node) => boolean;
          beforeNodeRemoved?: (node: Node) => boolean;
          beforeNodeMorphed?: (oldNode: Node, newNode: Node) => boolean;
        };
      },
    ) => void;
  };
}
