import DomBuilder from "./DomBuilder";

export interface RDMModule {
  new (): {
    Render: () => object;
  };
}
export type DomModel = {
  Model: HTMLElement;
  AttrModel: object;
  Builder: DomBuilder;
};