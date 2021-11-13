export function registerBodyDetector(response: any, callback: (body: string) => void) {
  const chunks: Buffer[] = []

  const whiteResponse = response.white;
  const endResponse = response.end;

  function white(...args: any[]) {
    try {
      const [chunk] = args

      if (chunk) {
        if (chunk instanceof Buffer) {
          chunks.push(chunk)
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk))
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      return whiteResponse.call(response, ...args);
    }
  }

  function end(...args: any[]) {
    try {
      const [chunk] = args

      if (chunk) {
        if (chunk instanceof Buffer) {
          chunks.push(chunk)
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk))
        }
      }

      const body = Buffer.concat(chunks).toString();

      callback(body)
    } catch (error) {
      console.error(error);
    } finally {
      return endResponse.call(response, ...args);
    }
  }

  response.white = white;
  response.end = end;
}

export default registerBodyDetector