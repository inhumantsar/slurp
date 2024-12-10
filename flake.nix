{
  inputs = {
    # nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    { systems, nixpkgs, ... }@inputs:
    let
      eachSystem = f: nixpkgs.lib.genAttrs (import systems) (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs

            # You can set the major version of Node.js to a specific one instead
            # of the default version
            # pkgs.nodejs-22_x

            # Comment out one of these to use an alternative package manager.
            # pkgs.yarn
            # pkgs.pnpm
            # pkgs.bun

            pkgs.nodePackages.typescript
            pkgs.nodePackages.typescript-language-server
          ];
        };
      });
    };
}

