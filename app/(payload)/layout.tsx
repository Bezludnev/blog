import configPromise from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ReactNode } from "react";

import { importMap } from "./admin/importMap.js";

type Props = {
  children: ReactNode;
};

async function serverFunction(args: {
  args: Record<string, unknown>;
  name: string;
}) {
  "use server";

  return handleServerFunctions({ ...args, config: configPromise, importMap });
}

export default function PayloadLayout({ children }: Props) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
}
