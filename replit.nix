{ pkgs }:
{
  deps = [
    pkgs.glibc
    pkgs.gcc
    pkgs.pkg-config
    pkgs.git
    pkgs.musl
    pkgs.tmux
    pkgs.nodejs_20
  ];
}
