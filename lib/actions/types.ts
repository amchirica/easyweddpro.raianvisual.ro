export type ActionResult<T = undefined> = {
  error?: string;
  success?: string;
  data?: T;
};

export function actionError<T = undefined>(message: string): ActionResult<T> {
  return { error: message };
}

export function actionSuccess<T = undefined>(
  success: string,
  data?: T,
): ActionResult<T> {
  return { success, data };
}
