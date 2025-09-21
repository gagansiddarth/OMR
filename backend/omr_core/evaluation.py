"""
Answer Evaluation and Scoring System
Handles answer key matching and flexible scoring schemes
"""

import csv
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from pathlib import Path


@dataclass
class EvaluationResult:
    """Result of answer evaluation"""
    question: str
    student_answer: str
    correct_answer: str
    verdict: str  # "correct", "incorrect", "unmarked"
    score: float
    confidence: float = 0.0


@dataclass
class ScoringReport:
    """Complete scoring report for an OMR sheet"""
    total_score: float
    max_possible_score: float
    percentage: float
    correct_answers: int
    incorrect_answers: int
    unmarked_answers: int
    multi_marked_answers: int
    evaluation_results: List[EvaluationResult]
    subject_scores: Dict[str, float] = None


class AnswerKeyManager:
    """Manages answer keys from various sources"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.answer_key = {}
        self.marking_schemes = {}
        self.load_answer_key()
        self.load_marking_schemes()
    
    def load_answer_key(self):
        """Load answer key from configured source"""
        source_type = self.config.get("source_type", "csv")
        
        if source_type == "csv":
            self.load_from_csv()
        elif source_type == "json":
            self.load_from_json()
        elif source_type == "inline":
            self.load_from_inline()
        else:
            raise ValueError(f"Unsupported answer key source type: {source_type}")
    
    def load_from_csv(self):
        """Load answer key from CSV file"""
        try:
            csv_path = self.config.get("options", {}).get("answer_key_csv_path", "answer_key.csv")
            
            if not Path(csv_path).exists():
                print(f"Answer key CSV not found: {csv_path}")
                return
            
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    question = row.get('question', '')
                    answer = row.get('answer', '')
                    if question and answer:
                        self.answer_key[question] = answer
            
            print(f"Loaded {len(self.answer_key)} answers from CSV")
            
        except Exception as e:
            print(f"Error loading answer key from CSV: {e}")
    
    def load_from_json(self):
        """Load answer key from JSON file"""
        try:
            json_path = self.config.get("options", {}).get("answer_key_json_path", "answer_key.json")
            
            if not Path(json_path).exists():
                print(f"Answer key JSON not found: {json_path}")
                return
            
            with open(json_path, 'r') as f:
                data = json.load(f)
                self.answer_key = data.get("answers", {})
            
            print(f"Loaded {len(self.answer_key)} answers from JSON")
            
        except Exception as e:
            print(f"Error loading answer key from JSON: {e}")
    
    def load_from_inline(self):
        """Load answer key from inline configuration"""
        try:
            self.answer_key = self.config.get("options", {}).get("answers", {})
            print(f"Loaded {len(self.answer_key)} answers from inline config")
            
        except Exception as e:
            print(f"Error loading answer key from inline: {e}")
    
    def load_marking_schemes(self):
        """Load marking schemes"""
        self.marking_schemes = self.config.get("marking_schemes", {
            "DEFAULT": {
                "correct": "1",
                "incorrect": "0",
                "unmarked": "0"
            }
        })
    
    def get_answer(self, question: str) -> str:
        """Get correct answer for a question"""
        return self.answer_key.get(question, "")
    
    def get_marking_scheme(self, scheme_name: str = "DEFAULT") -> Dict[str, str]:
        """Get marking scheme by name"""
        return self.marking_schemes.get(scheme_name, self.marking_schemes["DEFAULT"])


class OMREvaluator:
    """Main OMR evaluation engine"""
    
    def __init__(self, evaluation_config: Dict[str, Any]):
        self.config = evaluation_config
        self.answer_key_manager = AnswerKeyManager(evaluation_config)
        self.should_explain_scoring = evaluation_config.get("options", {}).get("should_explain_scoring", True)
    
    def evaluate_omr_response(self, omr_response: Dict[str, str], file_path: str = None) -> ScoringReport:
        """Evaluate OMR response against answer key"""
        try:
            evaluation_results = []
            marking_scheme = self.answer_key_manager.get_marking_scheme()
            
            total_score = 0.0
            correct_answers = 0
            incorrect_answers = 0
            unmarked_answers = 0
            multi_marked_answers = 0
            
            # Evaluate each question
            for question, student_answer in omr_response.items():
                correct_answer = self.answer_key_manager.get_answer(question)
                
                # Determine verdict and score
                if student_answer == correct_answer:
                    verdict = "correct"
                    score = float(marking_scheme["correct"])
                    correct_answers += 1
                elif student_answer == "" or student_answer is None:
                    verdict = "unmarked"
                    score = float(marking_scheme["unmarked"])
                    unmarked_answers += 1
                elif len(student_answer) > 1:
                    verdict = "multi_marked"
                    score = 0.0  # Multi-marked questions typically get 0
                    multi_marked_answers += 1
                else:
                    verdict = "incorrect"
                    score = float(marking_scheme["incorrect"])
                    incorrect_answers += 1
                
                total_score += score
                
                # Create evaluation result
                evaluation_result = EvaluationResult(
                    question=question,
                    student_answer=student_answer,
                    correct_answer=correct_answer,
                    verdict=verdict,
                    score=score
                )
                evaluation_results.append(evaluation_result)
            
            # Calculate percentage
            max_possible_score = len(omr_response) * float(marking_scheme["correct"])
            percentage = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            # Calculate subject scores if subjects are defined
            subject_scores = self.calculate_subject_scores(evaluation_results)
            
            return ScoringReport(
                total_score=total_score,
                max_possible_score=max_possible_score,
                percentage=percentage,
                correct_answers=correct_answers,
                incorrect_answers=incorrect_answers,
                unmarked_answers=unmarked_answers,
                multi_marked_answers=multi_marked_answers,
                evaluation_results=evaluation_results,
                subject_scores=subject_scores
            )
            
        except Exception as e:
            print(f"Error in evaluate_omr_response: {e}")
            return ScoringReport(
                total_score=0.0,
                max_possible_score=0.0,
                percentage=0.0,
                correct_answers=0,
                incorrect_answers=0,
                unmarked_answers=0,
                multi_marked_answers=0,
                evaluation_results=[],
                subject_scores={}
            )
    
    def calculate_subject_scores(self, evaluation_results: List[EvaluationResult]) -> Dict[str, float]:
        """Calculate scores by subject if subjects are defined"""
        try:
            # This is a simplified version - in practice, you'd need to map questions to subjects
            # For now, we'll just return the total score
            total_score = sum(result.score for result in evaluation_results)
            
            return {
                "Total": total_score
            }
            
        except Exception as e:
            print(f"Error in calculate_subject_scores: {e}")
            return {}
    
    def generate_detailed_report(self, scoring_report: ScoringReport, file_path: str = None) -> str:
        """Generate detailed evaluation report"""
        try:
            report_lines = []
            report_lines.append("=" * 50)
            report_lines.append("OMR EVALUATION REPORT")
            report_lines.append("=" * 50)
            report_lines.append(f"File: {file_path or 'Unknown'}")
            report_lines.append(f"Total Score: {scoring_report.total_score:.2f}/{scoring_report.max_possible_score:.2f}")
            report_lines.append(f"Percentage: {scoring_report.percentage:.2f}%")
            report_lines.append("")
            report_lines.append("SUMMARY:")
            report_lines.append(f"  Correct Answers: {scoring_report.correct_answers}")
            report_lines.append(f"  Incorrect Answers: {scoring_report.incorrect_answers}")
            report_lines.append(f"  Unmarked Answers: {scoring_report.unmarked_answers}")
            report_lines.append(f"  Multi-marked Answers: {scoring_report.multi_marked_answers}")
            report_lines.append("")
            
            if self.should_explain_scoring:
                report_lines.append("DETAILED RESULTS:")
                report_lines.append("-" * 30)
                
                for result in scoring_report.evaluation_results:
                    status_symbol = "✓" if result.verdict == "correct" else "✗" if result.verdict == "incorrect" else "○"
                    report_lines.append(f"{status_symbol} {result.question}: {result.student_answer} (Correct: {result.correct_answer}) - {result.verdict}")
            
            return "\n".join(report_lines)
            
        except Exception as e:
            print(f"Error generating detailed report: {e}")
            return f"Error generating report: {e}"
    
    def save_evaluation_csv(self, scoring_report: ScoringReport, file_path: str, output_path: str):
        """Save evaluation results to CSV"""
        try:
            with open(output_path, 'w', newline='') as f:
                writer = csv.writer(f)
                
                # Write header
                writer.writerow(['question', 'student_answer', 'correct_answer', 'verdict', 'score'])
                
                # Write results
                for result in scoring_report.evaluation_results:
                    writer.writerow([
                        result.question,
                        result.student_answer,
                        result.correct_answer,
                        result.verdict,
                        result.score
                    ])
            
            print(f"Evaluation results saved to: {output_path}")
            
        except Exception as e:
            print(f"Error saving evaluation CSV: {e}")


class EvaluationConfig:
    """Configuration for evaluation system"""
    
    @staticmethod
    def create_default_config() -> Dict[str, Any]:
        """Create default evaluation configuration"""
        return {
            "source_type": "inline",
            "options": {
                "should_explain_scoring": True,
                "answers": {}  # Will be populated with actual answers
            },
            "marking_schemes": {
                "DEFAULT": {
                    "correct": "1",
                    "incorrect": "0",
                    "unmarked": "0"
                },
                "WEIGHTED": {
                    "correct": "2",
                    "incorrect": "-0.5",
                    "unmarked": "0"
                }
            }
        }
    
    @staticmethod
    def create_from_test_data(test_subjects: List[Dict], answer_key: List[str]) -> Dict[str, Any]:
        """Create evaluation config from test data"""
        config = EvaluationConfig.create_default_config()
        
        # Create answers dictionary from test data
        answers = {}
        question_num = 1
        
        for subject in test_subjects:
            subject_questions = subject.get("questions", 0)
            subject_answer_key = subject.get("answer_key", [])
            
            for i in range(subject_questions):
                if i < len(subject_answer_key):
                    answers[f"q{question_num}"] = subject_answer_key[i]
                else:
                    answers[f"q{question_num}"] = "A"  # Default answer
                question_num += 1
        
        config["options"]["answers"] = answers
        return config
