{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.postgresql_16
    pkgs.curl
  ];
}
