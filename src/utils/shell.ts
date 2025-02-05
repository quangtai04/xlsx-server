import * as shell from 'shelljs';

export const run_shell_loop = async (data_cmd: {
  index: number;
  cmd: string[];
  options?: any;
  complete?: (stdout?: any) => void;
  error?: (err?: any) => void;
}): Promise<void> => {
  if (data_cmd.index === data_cmd.cmd.length) {
    data_cmd.complete?.();
    return;
  }
  run_shell(data_cmd.cmd[data_cmd.index], data_cmd.options)
    .then((stdout) => {
      if (data_cmd.index === data_cmd.cmd.length - 1) {
        data_cmd.complete?.(stdout);
        return;
      }
      run_shell_loop({ ...data_cmd, index: data_cmd.index + 1 });
    })
    .catch((err) => {
      data_cmd.error?.(err);
    });
};

export const run_shell = async (cmd: string, options?: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    shell.exec(cmd, options ?? {}, function (code, stdout, stderr) {
      if (code !== 0) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

export const RunShell = {
  run_shell,
  run_shell_loop,
};
