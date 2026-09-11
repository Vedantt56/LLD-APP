import { Project, SourceFile, ScriptTarget } from 'ts-morph';
import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';
import {
  EvaluationStrategy,
  EvaluationResult,
  DeterministicEvaluationResult,
  DeterministicRuleFeedback,
} from '../domain/evaluation';

export const RULE_WEIGHTS = {
  CLASS_COUNT: 0.20,
  GOD_CLASS: 0.20,
  ENCAPSULATION: 0.20,
  INTERFACE_USAGE: 0.25,
  NAMING: 0.15,
} as const;

export class DeterministicEvaluator implements EvaluationStrategy {
  async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES2022,
        allowJs: false,
      },
    });

    const sourceFile = project.createSourceFile('submission.ts', submission.code, { overwrite: true });

    // Handle syntax / parse errors gracefully
    const syntaxErrors = this.checkSyntaxErrors(sourceFile);
    if (syntaxErrors.length > 0) {
      const failedResult: DeterministicEvaluationResult = {
        score: 0,
        passed: false,
        ruleFeedbacks: [
          {
            ruleId: 'SYNTAX_CHECK',
            category: 'NAMING',
            passed: false,
            message: `TypeScript code failed to parse: ${syntaxErrors.join('; ')}`,
          },
        ],
      };

      return {
        id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        attemptId: submission.attemptId,
        status: 'COMPLETE',
        feedback: {
          deterministic: failedResult,
        },
        overallScore: 0,
        evaluatedAt: new Date(),
      };
    }

    // Run modular rule checks with transparent weights
    const classCountFb = this.checkClassCount(sourceFile);
    const godClassFb = this.checkGodClass(sourceFile);
    const encapsulationFb = this.checkEncapsulation(sourceFile);
    const interfaceUsageFb = this.checkInterfaceUsage(sourceFile, problem);
    const namingFb = this.checkNaming(sourceFile);

    const ruleFeedbacks: DeterministicRuleFeedback[] = [
      classCountFb.feedback,
      godClassFb.feedback,
      encapsulationFb.feedback,
      interfaceUsageFb.feedback,
      namingFb.feedback,
    ];

    // Calculate transparent weighted score
    const weightedScore = Math.round(
      classCountFb.score * RULE_WEIGHTS.CLASS_COUNT +
      godClassFb.score * RULE_WEIGHTS.GOD_CLASS +
      encapsulationFb.score * RULE_WEIGHTS.ENCAPSULATION +
      interfaceUsageFb.score * RULE_WEIGHTS.INTERFACE_USAGE +
      namingFb.score * RULE_WEIGHTS.NAMING
    );

    const overallPassed = ruleFeedbacks.every((r) => r.passed);

    const deterministicResult: DeterministicEvaluationResult = {
      score: weightedScore,
      passed: overallPassed,
      ruleFeedbacks,
    };

    return {
      id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attemptId: submission.attemptId,
      status: 'COMPLETE',
      feedback: {
        deterministic: deterministicResult,
      },
      overallScore: weightedScore,
      evaluatedAt: new Date(),
    };
  }

  private checkSyntaxErrors(sourceFile: SourceFile): string[] {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const errors: string[] = [];

    for (const diag of diagnostics) {
      const code = diag.getCode();
      if (code >= 1000 && code < 2000) {
        const message = diag.getMessageText();
        const text = typeof message === 'string' ? message : message.getMessageText();
        errors.push(text);
      }
    }

    return errors;
  }

  // 1. CLASS_COUNT (Weight: 20%)
  private checkClassCount(sourceFile: SourceFile): { score: number; feedback: DeterministicRuleFeedback } {
    const classes = sourceFile.getClasses();
    const count = classes.length;

    if (count === 0) {
      return {
        score: 0,
        feedback: {
          ruleId: 'CLASS_COUNT',
          category: 'CLASS_COUNT',
          passed: false,
          message: 'No domain classes found in submission.',
          details: { classCount: 0 },
        },
      };
    }

    if (count === 1) {
      return {
        score: 60,
        feedback: {
          ruleId: 'CLASS_COUNT',
          category: 'CLASS_COUNT',
          passed: true,
          message: 'Only 1 class found. Consider decomposing responsibility into specialized domain classes.',
          details: { classCount: 1 },
        },
      };
    }

    if (count >= 2 && count <= 10) {
      return {
        score: 100,
        feedback: {
          ruleId: 'CLASS_COUNT',
          category: 'CLASS_COUNT',
          passed: true,
          message: `Good class distribution: ${count} domain classes defined.`,
          details: { classCount: count },
        },
      };
    }

    return {
      score: 80,
      feedback: {
        ruleId: 'CLASS_COUNT',
        category: 'CLASS_COUNT',
        passed: true,
        message: `${count} classes defined. Ensure class responsibilities remain focused.`,
        details: { classCount: count },
      },
    };
  }

  // 2. GOD_CLASS (Weight: 20%)
  private checkGodClass(sourceFile: SourceFile): { score: number; feedback: DeterministicRuleFeedback } {
    const classes = sourceFile.getClasses();
    if (classes.length === 0) {
      return {
        score: 100,
        feedback: {
          ruleId: 'GOD_CLASS',
          category: 'GOD_CLASS',
          passed: true,
          message: 'No classes present to evaluate for God-class antipattern.',
        },
      };
    }

    let totalMembers = 0;
    const classMemberCounts: { name: string; memberCount: number }[] = [];

    for (const cls of classes) {
      const count = cls.getMethods().length + cls.getProperties().length;
      totalMembers += count;
      classMemberCounts.push({ name: cls.getName() || 'AnonymousClass', memberCount: count });
    }

    for (const clsInfo of classMemberCounts) {
      const percentage = totalMembers > 0 ? (clsInfo.memberCount / totalMembers) * 100 : 0;

      if (clsInfo.memberCount > 12 || (classes.length > 1 && clsInfo.memberCount > 5 && percentage > 65)) {
        return {
          score: 30,
          feedback: {
            ruleId: 'GOD_CLASS',
            category: 'GOD_CLASS',
            passed: false,
            message: `God-class detected: '${clsInfo.name}' has ${clsInfo.memberCount} members (${percentage.toFixed(1)}% of total codebase members).`,
            details: { godClassName: clsInfo.name, memberCount: clsInfo.memberCount, percentage },
          },
        };
      }
    }

    return {
      score: 100,
      feedback: {
        ruleId: 'GOD_CLASS',
        category: 'GOD_CLASS',
        passed: true,
        message: 'No God-classes detected. Class member responsibilities are well distributed.',
        details: { totalMembers },
      },
    };
  }

  // 3. ENCAPSULATION (Weight: 20%)
  private checkEncapsulation(sourceFile: SourceFile): { score: number; feedback: DeterministicRuleFeedback } {
    const classes = sourceFile.getClasses();
    let totalInstanceProps = 0;
    let publicPropsCount = 0;
    const publicPropNames: string[] = [];

    for (const cls of classes) {
      for (const prop of cls.getProperties()) {
        if (prop.isStatic()) continue; // Ignore static constants
        totalInstanceProps++;

        const scope = prop.getScope();
        if (scope === 'public' && !prop.isReadonly()) {
          publicPropsCount++;
          publicPropNames.push(`${cls.getName()}.${prop.getName()}`);
        }
      }
    }

    if (totalInstanceProps === 0) {
      return {
        score: 100,
        feedback: {
          ruleId: 'ENCAPSULATION',
          category: 'ENCAPSULATION',
          passed: true,
          message: 'No instance properties to evaluate for encapsulation.',
        },
      };
    }

    const encapsulatedCount = totalInstanceProps - publicPropsCount;
    const score = Math.round((encapsulatedCount / totalInstanceProps) * 100);
    const passed = score >= 80;

    if (publicPropsCount > 0) {
      return {
        score,
        feedback: {
          ruleId: 'ENCAPSULATION',
          category: 'ENCAPSULATION',
          passed,
          message: `Encapsulation warning: ${publicPropsCount} of ${totalInstanceProps} instance properties are declared public (${publicPropNames.join(', ')}). Use private or protected modifiers with getters/setters.`,
          details: { totalInstanceProps, publicPropsCount, publicPropNames },
        },
      };
    }

    return {
      score: 100,
      feedback: {
        ruleId: 'ENCAPSULATION',
        category: 'ENCAPSULATION',
        passed: true,
        message: 'Excellent encapsulation! All instance fields use private or protected access modifiers.',
        details: { totalInstanceProps },
      },
    };
  }

  // 4. INTERFACE_USAGE (Weight: 25%) - Objective checks against problem requirements
  private checkInterfaceUsage(
    sourceFile: SourceFile,
    problem: Problem
  ): { score: number; feedback: DeterministicRuleFeedback } {
    const expectedInterfaces = problem.requirements.flatMap((req) => req.expectedInterfaces || []);

    if (expectedInterfaces.length === 0) {
      const userInterfaces = sourceFile.getInterfaces();
      return {
        score: 100,
        feedback: {
          ruleId: 'INTERFACE_USAGE',
          category: 'INTERFACE_USAGE',
          passed: true,
          message: `Structural report: ${userInterfaces.length} interface(s) defined in solution. (No specific interface names required for this problem).`,
          details: { interfaceCount: userInterfaces.length },
        },
      };
    }

    const classes = sourceFile.getClasses();
    const implementedInterfaceNames = new Set<string>();

    for (const cls of classes) {
      for (const implClause of cls.getImplements()) {
        const text = implClause.getText().trim();
        if (text) {
          implementedInterfaceNames.add(text);
        }
      }
    }

    const missingOrUnimplemented: string[] = [];
    const satisfied: string[] = [];

    for (const expectedName of expectedInterfaces) {
      const astInterface = sourceFile.getInterface(expectedName);
      const isImplemented = implementedInterfaceNames.has(expectedName);

      if (astInterface && isImplemented) {
        satisfied.push(expectedName);
      } else {
        missingOrUnimplemented.push(expectedName);
      }
    }

    const score = Math.round((satisfied.length / expectedInterfaces.length) * 100);
    const passed = score === 100;

    if (!passed) {
      return {
        score,
        feedback: {
          ruleId: 'INTERFACE_USAGE',
          category: 'INTERFACE_USAGE',
          passed: false,
          message: `Interface usage check: Implemented: [${satisfied.join(', ')}]; Missing or unimplemented: [${missingOrUnimplemented.join(', ')}].`,
          details: { expectedInterfaces, satisfied, missingOrUnimplemented },
        },
      };
    }

    return {
      score: 100,
      feedback: {
        ruleId: 'INTERFACE_USAGE',
        category: 'INTERFACE_USAGE',
        passed: true,
        message: `All required interfaces (${expectedInterfaces.join(', ')}) are defined and implemented.`,
        details: { expectedInterfaces, satisfied },
      },
    };
  }

  // 5. NAMING (Weight: 15%)
  private checkNaming(sourceFile: SourceFile): { score: number; feedback: DeterministicRuleFeedback } {
    let totalSymbols = 0;
    let namingViolations = 0;
    const violationMessages: string[] = [];

    const isPascalCase = (str: string) => /^[A-Z][a-zA-Z0-9]*$/.test(str);
    const isCamelCase = (str: string) => /^[a-z][a-zA-Z0-9]*$/.test(str);

    // Classes
    for (const cls of sourceFile.getClasses()) {
      const name = cls.getName();
      if (name) {
        totalSymbols++;
        if (!isPascalCase(name)) {
          namingViolations++;
          violationMessages.push(`Class '${name}' should use PascalCase`);
        }
      }

      // Methods
      for (const method of cls.getMethods()) {
        const methodName = method.getName();
        totalSymbols++;
        if (!isCamelCase(methodName)) {
          namingViolations++;
          violationMessages.push(`Method '${name}.${methodName}' should use camelCase`);
        }
      }
    }

    // Interfaces
    for (const iface of sourceFile.getInterfaces()) {
      const name = iface.getName();
      totalSymbols++;
      if (!isPascalCase(name)) {
        namingViolations++;
        violationMessages.push(`Interface '${name}' should use PascalCase`);
      }
    }

    if (totalSymbols === 0) {
      return {
        score: 100,
        feedback: {
          ruleId: 'NAMING',
          category: 'NAMING',
          passed: true,
          message: 'No symbols found to evaluate for naming conventions.',
        },
      };
    }

    const score = Math.max(0, Math.round(((totalSymbols - namingViolations) / totalSymbols) * 100));
    const passed = namingViolations === 0;

    if (namingViolations > 0) {
      return {
        score,
        feedback: {
          ruleId: 'NAMING',
          category: 'NAMING',
          passed,
          message: `Naming convention issues: ${violationMessages.join('; ')}.`,
          details: { totalSymbols, namingViolations, violationMessages },
        },
      };
    }

    return {
      score: 100,
      feedback: {
        ruleId: 'NAMING',
        category: 'NAMING',
        passed: true,
        message: 'All classes, interfaces, and methods follow TypeScript naming conventions (PascalCase / camelCase).',
        details: { totalSymbols },
      },
    };
  }
}
