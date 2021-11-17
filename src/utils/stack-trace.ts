export interface StackTrace {
  fileName?: string | null
  lineNumber?: number | null
  functionName?: string | null
  typeName?: string | null
  methodName?: string | null
  columnNumber?: number | null
  native?: boolean | null
}

export function getStackTrace(error: Error): StackTrace[] {
  const stack: StackTrace[] = []

  if (error.stack) {
    const lines = error.stack.split('\n').slice(1);

    lines.forEach(line => {
      if (line.match(/^\s*[-]{4,}$/)) {
        stack.push({ fileName: line })

        return
      }
      
      const lineMatch = line.match(/at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);

      if (!lineMatch) {
        return;
      }
      
      let object = null;
      let method = null;
      let functionName = null;
      let typeName = null;
      let methodName = null;
      let isNative = lineMatch[5] === 'native';
      
      if (lineMatch[1]) {
        functionName = lineMatch[1];
        
        let methodStart = functionName.lastIndexOf('.');
        
        if (functionName[methodStart-1] == '.') {
          methodStart--;
        }

        if (methodStart > 0) {
          object = functionName.substr(0, methodStart);
          method = functionName.substr(methodStart + 1);

          const objectEnd = object.indexOf('.Module');

          if (objectEnd > 0) {
            functionName = functionName.substr(objectEnd + 1);
            object = object.substr(0, objectEnd);
          }
        }
      }

      if (method) {
        typeName = object;
        methodName = method;
      }

      if (method === '<anonymous>') {
        methodName = null;
        functionName = null;
      }

      stack.push({
        fileName: lineMatch[2] || null,
        lineNumber: parseInt(lineMatch[3], 10) || null,
        functionName: functionName,
        typeName: typeName,
        methodName: methodName,
        columnNumber: parseInt(lineMatch[4], 10) || null,
        'native': isNative,
      })
    })
  }

  return stack
}
