import { FC } from "react";

const KeyboardKey: FC<{ name: string }> = ({ name }) => {
  return (
    <span className="mx-1 rounded-sm p-1 text-sm ring-1 ring-white/20">
      {name}
    </span>
  );
};

export default KeyboardKey;
