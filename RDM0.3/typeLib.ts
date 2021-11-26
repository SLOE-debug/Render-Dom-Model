export type ObjectStructure = {
  t: string;
  c?: Array<NodeStructure>;
  click?: Function;
  input?: Function;
} & Data;
export type Data = {
  value?: AttrValue;
  className?: AttrValue;
  textContent?: string | object;
  [x: string]: any;
};

export type AttrValue = string | number | boolean | undefined | any;

export type NodeStructure = string | ObjectStructure | Array<ObjectStructure>;
