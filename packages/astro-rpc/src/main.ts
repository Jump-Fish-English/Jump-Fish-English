import type { AstroIntegration } from "astro";
import type { PluginOption } from "vite";
import { readFileSync } from 'fs';
import { resolve as resolvePath, dirname } from 'path';
import glob from 'glob';
import { parse } from '@babel/core';
import { traverse } from '@babel/core';

interface RpcDefinition {
  client: {
    urlPath: string;
  },
  server: {
    virtualFileSystemPath: string;
  }
  file: {
    path: string;
    exportName: string;
  }
}

export function rpc(): AstroIntegration {
  return {
    name: 'astro-rpc',
    hooks: {
      'astro:config:setup': ({ updateConfig, injectRoute, config }) => {
        const srcDir = config.srcDir.pathname;
        const rpcs = glob.sync(`${srcDir}/rpc/**/*.ts`);

        const RPCS = rpcs.reduce((acc, globPath) => {
          const contents = readFileSync(globPath).toString();
          const result = parse(contents, {
            filename: globPath,
            presets: [
              '@babel/preset-typescript'
            ]
          });
          if (result === null) {
            throw new Error(`${globPath} does not contain valid Javascript or Typescript`);
          }

          const exportNames: string[] = [];
          traverse(result, {
            ExportNamedDeclaration(path) {
              const { declaration } = path.node;
              switch(declaration?.type) {
                case 'FunctionDeclaration': {
                  const { id: declarationId } = declaration;
                  if (declarationId === undefined || declarationId === null) {
                    throw new Error('Unsupported unnamed export in RPC file.');
                  }

                  
                  exportNames.push(declarationId.name);
                }
              }
            }
          });
          
          

          const next: RpcDefinition[] = exportNames.map((exportName) => {
            const urlPath = '/hryyy';
            return {
              client: {
                urlPath,
              },
              server: {
                virtualFileSystemPath: resolvePath(`./__rpc__/server${urlPath}`),
              },
              file: {
                path: globPath,
                exportName,
              }
            };
          })

          return [
            ...acc,
            ...next,
          ];
        }, [] as RpcDefinition[]);

        RPCS.forEach(({ server: { virtualFileSystemPath }, client: { urlPath } }) => {
          injectRoute({
            pattern: urlPath,
            entryPoint: virtualFileSystemPath,
          })
        });
        
        const plugin: PluginOption = {
         enforce: 'pre',
         name: 'vite-plugin-rpc',
         resolveId(source, importer) {
           if (importer === undefined) {
             return;
           }

           if (/index\.html/.test(importer) === true) {
            return;
           }
           
           const fullImportPath = resolvePath(dirname(importer), source);
           const match = RPCS.find((entry) => {
            return entry.file.path === fullImportPath;
           });

           if (match === null || match === undefined) {
            return;
           }

           const { client: { urlPath }, server: { virtualFileSystemPath } } = match;

           // do not create a virtual path for our server virtual modules!
           if (source === virtualFileSystemPath || importer === virtualFileSystemPath) {
            return;
           }

           return `virtual:client:${urlPath}`;
         },
         load(id){
          if (/virtual\:client/.test(id)) {
            // we inject a module for consumption in the client
            const path = id.replace('virtual:client:', '');
            const def = RPCS.find((entry) => {
              return entry.client.urlPath === path;
            });

            if (def === undefined) {
              throw new Error(`Unable to resolve "${id}". No matching definition found`);
            }
            return `
              export async function test(data) {
                return await fetch('${def.client.urlPath}', {
                  method: 'post',
                  body: JSON.stringify(data),
                }).then((resp) => {
                  return resp.json();
                })
              }
            `;
          }

         
          
          const serverDef = Object.values(RPCS).find((entry) => {
            return entry.server.virtualFileSystemPath === id;
          });

          if (serverDef === undefined) {
            return;
          }

          return `
            import { ${serverDef.file.exportName} as executeLocal } from '${serverDef.file.path}';
            export async function POST({ params, request }) {
              const data = await request.json();
              const response = await executeLocal(data);
              return new Response(JSON.stringify(response), {
                status: 200,
                statusText: 'ok'
              });
            }
          `;
         }
         
        }
        updateConfig({
          vite: {
            plugins: [
              plugin,
            ],
          }
        })
      }
    }
  }
}