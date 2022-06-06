APP_NPM_CLI_BIN="$ROOT_DIR/node_modules/.bin"
APP_NPM_CACHE="$ROOT_DIR/node_modules/.cache"

__PROCESS_START=""

function get_timestamp() {
  if [[ $OSTYPE == 'darwin'* ]]; then
    echo "$(perl -MTime::HiRes -e 'printf("%.0f\n",Time::HiRes::time()*1000)' | cut -b1-13)"
  else
    echo "$(date +%s%N | cut -b1-13)"
  fi
}

function print_time_diff() {
  local PROCESS_END="$(get_timestamp)"
  local RUNTIME=$((PROCESS_END - __PROCESS_START))

  if [[ $RUNTIME -gt 1000 ]]; then
    RUNTIME=$((RUNTIME / 1000))
    TYPE="s"
  else
    TYPE="ms"
  fi

  if [[ "$(command -v printf)" == "" ]]; then
    echo -e " $RUNTIME $TYPE"
  else
    printf "%8s\n" "$RUNTIME $TYPE"
  fi
}

function print_log_section() {
  local FILE="$1"
  local TITLE="$2"

  echo "" >> "$FILE"
  echo "------------------------------------------------------------" >> "$FILE"
  echo "-- $TITLE" >> "$FILE"
}

function pad_dots() {
  local MESSAGE="$1"

  local LENGTH_MSG=${#MESSAGE}
  local LENGTH_DOT=$((61 - $LENGTH_MSG))

  for INDEX in $(seq $LENGTH_DOT); do
    echo -en "."
  done
}

function print_row_wait() {
  local MESSAGE="$1"
  local DOTS="$2"

  local DOTS="$(pad_dots "$MESSAGE")"

  __PROCESS_START="$(get_timestamp)"

  echo -en " \033[1;34m* $MESSAGE\033[0m $DOTS "
  echo -en "\033[0;100;5m WAIT \033[0m "
}

function print_done() {
  echo -en "\b\b\b\b\b\b\b\033[0;42m DONE \033[0m"
  print_time_diff
}

function print_fail() {
  echo -en "\b\b\b\b\b\b\b\033[0;41m FAIL \033[0m"
  print_time_diff
}

function print_kill() {
  echo -en "\b\b\b\b\b\b\b\033[0;43m KILL \033[0m"
  print_time_diff
}

function print_skip() {
  echo -en "\b\b\b\b\b\b\b\033[0;44m SKIP \033[0m"
  print_time_diff
}

function end_cmd_die() {
  local EXIT_CODE=$1
  local ERROR_MSG="$2"

  if [[ 0 == $EXIT_CODE ]]; then
    print_done
  else
    print_fail
    echo ""
    echo -e " 😱 \033[0;31mOh-no. $ERROR_MSG\033[0m 💀"
    echo ""

    exit 1
  fi
}

function exit_on_fail() {
  local CMD_EXIT_CODE="$1"

  if [[ $CMD_EXIT_CODE != 0 ]]; then
    exit $CMD_EXIT_CODE
  fi
}

function end_cmd() {
  local EXIT_CODE=$1

  if [[ 0 == $EXIT_CODE ]]; then
    print_done
  else
    print_fail
  fi
}

function on_process_kill() {
  echo -en "\b\b"
  print_kill

  echo ""
  exit 10000
}

function set_title() {
  local TITLE="$1"

  printf "\e]2;$TITLE\a"
}

function assert_network_connected() {
  ping -q -t1 -c1 "google.com" &> /dev/null
  if [[ $? != 0 ]]; then
    echo ""
    echo -e " \033[0;31m You don't have an internet connection.\033[0m"
    echo ""

    exit 10000
  fi
}

function execute_action() {
  local LOG_FILE_PATH="$1"
  local EXECUTE_COMMAND="$2"
  local MESSAGE_LOG="$3"
  local MESSAGE_ERROR="$4"

  set_title "$MESSAGE_LOG ..."
  print_log_section "$LOG_FILE_PATH" "$MESSAGE_LOG"
  print_row_wait "$MESSAGE_LOG"

  eval "$EXECUTE_COMMAND" >> "$LOG_FILE_PATH"
  end_cmd_die $? "$MESSAGE_ERROR"
}
