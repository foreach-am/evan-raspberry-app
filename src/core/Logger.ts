class Logger {
  static info(...args: AnyType) {
    console.log('-->>  INFO:', ...args);
  }

  static error(...args: AnyType) {
    console.error('-->> ERROR:', ...args);
  }

  static warning(...args: AnyType) {
    console.warn('-->>  WARN:', ...args);
  }

  static json(title: string, ...args: AnyType) {
    console.log('-->>  JSON:', title);

    const spaces = '          : ';
    args.forEach((arg: AnyType) => {
      try {
        let dataString = JSON.stringify(arg, null, 2);
        dataString = dataString.replace(/\n/g, '\n' + spaces);
        dataString = spaces + dataString;

        console.log(dataString);
      } catch (e) {
        // ...
      }
    });
  }

  static divider() {
    console.log(
      '==================================================================================='
    );
  }
}

export default Logger;
