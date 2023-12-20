export async function postBodyString({ message }: { message: string }) {
  return `What a wonderful ${message}`;
}