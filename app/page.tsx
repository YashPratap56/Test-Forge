'use client';

// importing stuff i need
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { saveAs } from 'file-saver';

// this is to stop server side rendering issues with monaco
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// types for the api response
interface TestGenerationResponse {
  success: boolean;
  tests?: string;
  error?: string;
}

export default function Home() {
  // state variables - using useState for everything
  const [inputCode, setInputCode] = useState(''); // the function code user types
  const [generatedTests, setGeneratedTests] = useState(''); // the tests we generate
  const [isLoading, setIsLoading] = useState(false); // loading spinner
  const [error, setError] = useState(''); // error messages
  const [functionName, setFunctionName] = useState(''); // optional function name

  // project analysis stuff - added this later
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // the zip file
  const [projectAnalysis, setProjectAnalysis] = useState(''); // analysis results
  const [isAnalyzing, setIsAnalyzing] = useState(false); // another loading state
  const [analysisError, setAnalysisError] = useState(''); // analysis errors

  // debug stuff - keeping track of what's happening
  console.log('Component rendered, inputCode length:', inputCode.length);

  // function to generate tests - this calls the backend
  const handleGenerateTests = async () => {
    // basic validation - check if user entered something
    if (!inputCode.trim()) {
      setError('Please enter a JavaScript function');
      return; // exit early
    }

    // set loading to true and clear previous results
    setIsLoading(true);
    setError('');
    setGeneratedTests('');

    // debug log
    console.log('Starting test generation for function:', functionName || 'unnamed');

    try {
      // make the api call to backend
      const response = await fetch('http://localhost:3001/api/generate-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionCode: inputCode, // the code from the editor
          functionName: functionName.trim() || undefined, // optional name
        }),
      });

      // parse the response
      const data: TestGenerationResponse = await response.json();

      // check if it worked
      if (data.success && data.tests) {
        setGeneratedTests(data.tests); // set the generated tests
        console.log('Tests generated successfully');
      } else {
        // show error message
        setError(data.error || 'Failed to generate tests');
        console.error('Test generation failed:', data.error);
      }
    } catch (err) {
      // network or other error
      console.error('Error calling backend:', err);
      setError('Failed to connect to backend server. Make sure it\'s running on port 3001.');
    } finally {
      // always set loading to false
      setIsLoading(false);
    }
  };

  // download the generated tests
  const handleDownloadTests = () => {
    // check if we have tests to download
    if (!generatedTests) {
      console.log('No tests to download');
      return; // exit if no tests
    }

    // figure out the filename
    const fileName = functionName.trim() || 'testFunction';

    // create the file blob
    const blob = new Blob([generatedTests], { type: 'text/javascript' });

    // download it
    saveAs(blob, `${fileName}.test.js`);

    // log success
    console.log('Test file downloaded:', `${fileName}.test.js`);
  };

  // copy to clipboard function - for the generated tests
  const handleCopyToClipboard = async () => {
    if (!generatedTests) return; // no tests to copy

    try {
      await navigator.clipboard.writeText(generatedTests);
      // TODO: add a toast notification here later
      console.log('Tests copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // maybe show an alert instead
      alert('Failed to copy tests to clipboard');
    }
  };

  // project analysis functions - this is for the zip file upload feature
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // get the file from input
    const file = event.target.files?.[0];
    if (file) {
      // check if it's a zip file
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file); // set the file
        setAnalysisError(''); // clear any previous errors
        console.log('ZIP file selected:', file.name);
      } else {
        // wrong file type
        setAnalysisError('Please select a ZIP file');
        setSelectedFile(null);
      }
    }
  };

  // function to analyze the project
  const handleAnalyzeProject = async () => {
    // check if file is selected
    if (!selectedFile) {
      setAnalysisError('Please select a ZIP file first');
      return;
    }

    // set loading states
    setIsAnalyzing(true);
    setAnalysisError('');
    setProjectAnalysis('');

    console.log('Starting project analysis for:', selectedFile.name);

    try {
      // create form data for file upload
      const formData = new FormData();
      formData.append('projectZip', selectedFile); // add the file

      // call the backend
      const response = await fetch('http://localhost:3001/api/analyze-project', {
        method: 'POST',
        body: formData, // send the file
      });

      // get response
      const data = await response.json();
      console.log('Analysis response:', data);

      // check if successful
      if (data.success && data.analysis) {
        setProjectAnalysis(data.analysis); // set the analysis
        console.log('Project analyzed successfully');
      } else {
        // show error
        setAnalysisError(data.error || 'Failed to analyze project');
      }
    } catch (err) {
      // error handling
      console.error('Project analysis error:', err);
      setAnalysisError('Failed to connect to backend server. Make sure it\'s running on port 3001.');
    } finally {
      // always stop loading
      setIsAnalyzing(false);
    }
  };

  // download the analysis report
  const handleDownloadReport = () => {
    if (!projectAnalysis) return; // nothing to download

    const blob = new Blob([projectAnalysis], { type: 'text/plain' });
    saveAs(blob, 'project-analysis-report.txt');
    console.log('Report downloaded');
  };

  // copy analysis to clipboard
  const handleCopyAnalysisToClipboard = async () => {
    if (!projectAnalysis) return; // guard clause

    try {
      // use the modern clipboard API
      await navigator.clipboard.writeText(projectAnalysis);
      console.log('Analysis copied to clipboard successfully');

      // TODO: maybe show a success message later - could use a toast library
      // for now just log it
    } catch (err) {
      // fallback error handling
      console.error('Failed to copy analysis to clipboard:', err);

      // show user-friendly error
      alert('Failed to copy analysis - please copy manually');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* header section - i made this gradient */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" style={{ minHeight: '120px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* left side - logo and title */}
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">TestForge</h1>
                <p className="text-blue-100 text-sm">One-Click Test Generator & Code Analyzer</p>
              </div>
            </div>

            {/* right side - status - only show on bigger screens */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Backend Active</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-100">Server Status</p>
                <p className="text-sm font-mono">localhost:3001</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* debug info - keeping this for now */}
        {/* <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 text-xs">
          Debug: inputCode length: {inputCode.length}, hasFile: {selectedFile ? 'yes' : 'no'}
        </div> */}
        {/* project upload section - this is for analyzing zip files */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden" style={{ marginBottom: '2rem' }}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Project Analyzer</h2>
                  <p className="text-purple-100 text-sm">
                    Upload your project ZIP for intelligent code analysis and suggestions
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* file input section */}
              <div className="mb-6">
                <label htmlFor="projectZip" className="block text-sm font-semibold text-gray-800 mb-3">
                  📁 Select Project ZIP File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="projectZip"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100"
                  />
                  {/* overlay text - shows when no file selected */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop your ZIP file here or click to browse'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* show selected file info */}
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">
                      File ready: {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* analyze button */}
              <button
                onClick={handleAnalyzeProject}
                disabled={isAnalyzing || !selectedFile}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                style={{ boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    🔍 Analyzing Your Project...
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>🚀 Analyze Project</span>
                  </div>
                )}
              </button>

              {/* error message display */}
              {analysisError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-red-700">{analysisError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Project Analysis Results */}
        {projectAnalysis && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analysis Complete!</h2>
                    <p className="text-green-100 text-sm">
                      Your project has been analyzed for improvements and potential issues
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={handleDownloadReport}
                    className="bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 font-medium text-sm flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleCopyAnalysisToClipboard}
                    className="bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 font-medium text-sm flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleDownloadReport}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium text-sm flex items-center justify-center space-x-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>📥 Download Report</span>
                </button>
                <button
                  onClick={handleCopyAnalysisToClipboard}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-sm flex items-center justify-center space-x-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>📋 Copy to Clipboard</span>
                </button>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 max-h-96 overflow-y-auto border border-gray-200">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {projectAnalysis}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Input Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Function Input</h2>
                  <p className="text-blue-100 text-sm">
                    Paste your JavaScript or TypeScript function to generate comprehensive tests
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label htmlFor="functionName" className="block text-sm font-semibold text-gray-800 mb-3">
                  🔧 Function Name (Optional)
                </label>
                <input
                  type="text"
                  id="functionName"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  placeholder="e.g., calculateTotal, processUserData"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  style={{ borderWidth: '1px' }}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  📝 Function Code
                </label>
                <MonacoEditor
                  height="350px"
                  language="javascript"
                  value={inputCode}
                  onChange={(value) => setInputCode(value || '')}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>
              <button
                onClick={handleGenerateTests}
                disabled={isLoading || !inputCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                style={{ fontFamily: 'inherit' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    ⚡ Generating Smart Tests...
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>🚀 Generate Tests</span>
                  </div>
                )}
              </button>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Output Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Generated Tests</h2>
                  <p className="text-green-100 text-sm">
                    Your comprehensive Jest unit tests with edge cases and mocks
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {generatedTests ? (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleDownloadTests}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium text-sm flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>📥 Download Tests</span>
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-sm flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>📋 Copy Tests</span>
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <MonacoEditor
                      height="350px"
                      language="javascript"
                      value={generatedTests}
                      theme="vs-light"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 }
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Tests</h3>
                    <p className="text-sm text-gray-600 max-w-sm">
                      Paste your JavaScript function in the input section and click "Generate Tests" to see comprehensive Jest unit tests here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Example Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Try It Out!</h2>
                <p className="text-indigo-100 text-sm">
                  Click below to load an example function and see TestForge in action
                </p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <button
                onClick={() => {
                  setInputCode(`function calculateTotal(items, taxRate = 0.1) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const tax = subtotal * taxRate;
  return subtotal + tax;
}

function processUserData(user) {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user data');
  }

  return {
    id: user.id,
    fullName: \`\${user.firstName} \${user.lastName}\`,
    isActive: user.status === 'active',
    joinedAt: new Date(user.createdAt)
  };
}

module.exports = { calculateTotal, processUserData };`);
                  setFunctionName('calculateTotal');
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                🚀 Load Example Function
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Example Function Preview</span>
              </h3>
              <MonacoEditor
                height="250px"
                language="javascript"
                value={`function calculateTotal(items, taxRate = 0.1) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const tax = subtotal * taxRate;
  return subtotal + tax;
}

module.exports = calculateTotal;`}
                theme="vs-light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 }
                }}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="mt-16 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">TestForge</h3>
              </div>
              <p className="text-gray-300 text-sm mb-6 max-w-2xl mx-auto">
                The ultimate tool for generating comprehensive Jest unit tests and analyzing project code quality.
                Built with modern web technologies for developers who value quality and efficiency.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Backend Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Real-time Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>AI-Powered Analysis</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>© 2024 TestForge by Supernova Corp. Built with Next.js, TypeScript, and modern web technologies.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
