export interface Project {
  projectid: string;
  name: string;
  created: string;
  disabled: boolean;
  orgid: string;
  orgName: string;
  orgFk: string;
}

export interface BuildTarget {
  buildtargetid: string;
  name: string;
  enabled: boolean;
  platform: string;
  settings?: {
    scm?: {
      branch?: string;
    };
  };
}

export interface BuildReport {
  errors?: number;
  warnings?: number;
}

export interface ChangesetEntry {
  commitId: string;
  message: string;
  author?: {
    fullName?: string;
  };
}

export interface BuildLinks {
  log?: { href: string };
  download_primary?: { href: string };
  artifacts?: Array<{ href: string; key: string }>;
}

export interface Build {
  build: number;
  buildtargetid: string;
  buildTargetName?: string;
  buildStatus: string;
  platform: string;
  scmBranch?: string;
  created: string;
  finished?: string | null;
  totalTimeInSeconds?: number;
  lastBuiltRevision?: string;
  buildReport?: BuildReport;
  changeset?: ChangesetEntry[];
  links?: BuildLinks;
}
